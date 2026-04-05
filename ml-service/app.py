from flask import Flask, request, jsonify
import base64
import json
import os
import io
import cv2
import numpy as np

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@app.before_request
def handle_options():
    from flask import request as req
    if req.method == "OPTIONS":
        from flask import Response
        return Response(status=200)

@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    return jsonify({}), 200

# ── File paths ────────────────────────────────────────────────────────────────
BASE_DIR          = os.path.dirname(__file__)
MODEL_PATH        = os.path.join(BASE_DIR, "models", "disease_model.keras")
CLASS_NAMES_PATH  = os.path.join(BASE_DIR, "models", "class_names.json")
TREATMENTS_PATH   = os.path.join(BASE_DIR, "models", "treatments.json")

# ── Model state ───────────────────────────────────────────────────────────────
model       = None
class_names = []
treatments  = {}


def load_assets():
    global model, class_names, treatments

    if os.path.exists(CLASS_NAMES_PATH):
        with open(CLASS_NAMES_PATH) as f:
            class_names = json.load(f)
        print(f"[ML] Loaded {len(class_names)} class names.")

    if os.path.exists(TREATMENTS_PATH):
        with open(TREATMENTS_PATH) as f:
            treatments = json.load(f)
        print(f"[ML] Loaded {len(treatments)} treatment entries.")

    if os.path.exists(MODEL_PATH):
        try:
            import tensorflow as tf

            _orig_dense_init = tf.keras.layers.Dense.__init__
            def _compat_dense_init(self, *args, **kwargs):
                kwargs.pop("quantization_config", None)
                _orig_dense_init(self, *args, **kwargs)
            tf.keras.layers.Dense.__init__ = _compat_dense_init

            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            print("[ML] Disease model loaded successfully.")
        except Exception as e:
            print(f"[ML] Model load failed: {e}. Running in demo mode.")
    else:
        print(f"[ML] Model file not found at {MODEL_PATH}. Running in demo mode.")


load_assets()


# ── Leaf preprocessing (OpenCV) ───────────────────────────────────────────────
def preprocess_leaf(pil_img):
    """
    Isolate the leaf from the background using GrabCut, then enhance contrast
    with CLAHE so the image looks closer to PlantVillage training conditions.
    Falls back to the original image if the mask is too sparse.
    """
    img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # ── GrabCut: assume the leaf occupies the central 80% ────────────────────
    h, w = img_bgr.shape[:2]
    rect = (int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90))
    mask_gc   = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img_bgr, mask_gc, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    except Exception:
        return pil_img  

    leaf_mask = np.where((mask_gc == 2) | (mask_gc == 0), 0, 255).astype(np.uint8)

    # ── Fallback: if mask covers < 10% of image, skip segmentation ───────────
    if leaf_mask.sum() < h * w * 255 * 0.10:
        return pil_img

    # ── Morphological cleanup ─────────────────────────────────────────────────
    kernel    = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN,  kernel)

    # ── Soft edge blend ───────────────────────────────────────────────────────
    mask_blur = cv2.GaussianBlur(leaf_mask, (21, 21), 0).astype(np.float32) / 255.0
    mask_3ch  = np.stack([mask_blur] * 3, axis=-1)

    # ── Composite onto neutral grey (PlantVillage-style background) ───────────
    img_f  = img_bgr.astype(np.float32)
    bg     = np.full_like(img_f, 200.0)
    result = (img_f * mask_3ch + bg * (1 - mask_3ch)).astype(np.uint8)

    # ── CLAHE contrast enhancement on L channel ───────────────────────────────
    lab      = cv2.cvtColor(result, cv2.COLOR_BGR2LAB)
    clahe    = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    result   = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    from PIL import Image as PILImage
    return PILImage.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


# ── Disease detection ─────────────────────────────────────────────────────────
@app.route("/detect-disease", methods=["POST"])
def detect_disease():
    data = request.get_json(force=True) or {}
    image_b64 = data.get("image", "")

    if not image_b64:
        return jsonify({"error": "No image provided"}), 400

    # ── Demo fallback (no model) ──────────────────────────────────────────────
    if model is None:
        demo_label = "Tomato___Early_blight"
        demo_treatment = treatments.get(demo_label, {})
        return jsonify({
            "label":         demo_label,
            "confidence":    0.87,
            "treatment_en":  demo_treatment.get("en", "Apply copper-based fungicide and remove infected leaves."),
            "treatment_ar":  demo_treatment.get("ar", "استخدم مبيداً فطرياً نحاسياً وأزل الأوراق المصابة."),
            "mock":          True,
        })

    # ── Real inference ────────────────────────────────────────────────────────
    try:
        from PIL import Image
        import tensorflow as tf

        # Strip data-URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = preprocess_leaf(img)
        img = img.resize((224, 224))
        img_array = np.expand_dims(
            tf.keras.applications.mobilenet_v3.preprocess_input(np.array(img, dtype=np.float32)),
            axis=0,
        )

        preds = model.predict(img_array)
        top3_idx = preds[0].argsort()[-3:][::-1]

        top3 = []
        for i in top3_idx:
            lbl = class_names[str(i)] if class_names else f"class_{i}"
            tr  = treatments.get(lbl, {})
            top3.append({
                "label":        lbl,
                "confidence":   round(float(preds[0][i]), 4),
                "treatment_en": tr.get("en", "Consult an agronomist for treatment advice."),
                "treatment_ar": tr.get("ar", "استشر خبيراً زراعياً للحصول على نصيحة العلاج."),
            })

        return jsonify({
            "label":        top3[0]["label"],
            "confidence":   top3[0]["confidence"],
            "treatment_en": top3[0]["treatment_en"],
            "treatment_ar": top3[0]["treatment_ar"],
            "top3":         top3,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Crop recommendation (rule-based decision tree) ────────────────────────────
CROP_RULES = [
    {"crop": "Tomato", "moisture": (50, 75), "temp": (20, 30), "humidity": (50, 70), "ph": (6.0, 6.8)},
    {"crop": "Potato", "moisture": (60, 80), "temp": (15, 25), "humidity": (60, 80), "ph": (5.5, 6.5)},
    {"crop": "Pepper", "moisture": (50, 70), "temp": (20, 32), "humidity": (50, 70), "ph": (6.0, 7.0)},
]


def _in_range(val, lo, hi):
    """Score how well a value fits a range (1.0 = perfect, 0.0 = far outside)."""
    if val is None:
        return 0.5
    if lo <= val <= hi:
        return 1.0
    span = hi - lo or 1
    dist = min(abs(val - lo), abs(val - hi))
    return max(0.0, 1.0 - dist / span)


def _score_crop(rule, moisture, temp, humidity, ph):
    return round(
        _in_range(moisture,  *rule["moisture"])  * 0.40 +
        _in_range(temp,      *rule["temp"])       * 0.25 +
        _in_range(humidity,  *rule["humidity"])   * 0.20 +
        _in_range(ph,        *rule["ph"])         * 0.15,
        3,
    )


@app.route("/predict-crop", methods=["POST"])
def predict_crop():
    data     = request.get_json(force=True) or {}
    moisture = data.get("moisture")
    temp     = data.get("temperature")
    humidity = data.get("humidity")
    ph       = data.get("ph")

    scored = sorted(
        [{"crop": r["crop"], "score": _score_crop(r, moisture, temp, humidity, ph)} for r in CROP_RULES],
        key=lambda x: x["score"],
        reverse=True,
    )

    return jsonify({
        "recommended_crop": scored[0]["crop"],
        "confidence":       scored[0]["score"],
        "all_scores":       scored,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4040, debug=True)
