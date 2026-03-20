from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import os
import io

app = Flask(__name__)
CORS(app)

# ── File paths ────────────────────────────────────────────────────────────────
BASE_DIR          = os.path.dirname(__file__)
MODEL_PATH        = os.path.join(BASE_DIR, "disease_model.keras")
CLASS_NAMES_PATH  = os.path.join(BASE_DIR, "class_names.json")
TREATMENTS_PATH   = os.path.join(BASE_DIR, "treatments.json")

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
            model = tf.keras.models.load_model(MODEL_PATH)
            print("[ML] Disease model loaded successfully.")
        except Exception as e:
            print(f"[ML] Model load failed: {e}. Running in demo mode.")
    else:
        print(f"[ML] Model file not found at {MODEL_PATH}. Running in demo mode.")


load_assets()


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
        import numpy as np
        from PIL import Image
        import tensorflow as tf

        # Strip data-URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((224, 224))
        img_array = np.expand_dims(np.array(img) / 255.0, axis=0)

        preds = model.predict(img_array)
        idx   = int(preds[0].argmax())
        conf  = float(preds[0][idx])
        label = class_names[idx] if class_names else f"class_{idx}"

        treatment = treatments.get(label, {})
        return jsonify({
            "label":        label,
            "confidence":   round(conf, 4),
            "treatment_en": treatment.get("en", "Consult an agronomist for treatment advice."),
            "treatment_ar": treatment.get("ar", "استشر خبيراً زراعياً للحصول على نصيحة العلاج."),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Crop recommendation (rule-based decision tree) ────────────────────────────
CROP_RULES = [
    {"crop": "Tomato", "moisture": (50, 75), "temp": (20, 30), "humidity": (50, 70), "ph": (6.0, 6.8)},
    {"crop": "Potato", "moisture": (60, 80), "temp": (15, 25), "humidity": (60, 80), "ph": (5.5, 6.5)},
    {"crop": "Pepper", "moisture": (50, 70), "temp": (20, 32), "humidity": (50, 70), "ph": (6.0, 7.0)},
    {"crop": "Wheat",  "moisture": (40, 65), "temp": (12, 25), "humidity": (40, 65), "ph": (6.0, 7.5)},
    {"crop": "Corn",   "moisture": (55, 75), "temp": (18, 32), "humidity": (50, 75), "ph": (5.8, 7.0)},
    {"crop": "Rice",   "moisture": (75, 95), "temp": (22, 35), "humidity": (70, 90), "ph": (5.5, 7.0)},
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
    app.run(host="0.0.0.0", port=5000, debug=True)
