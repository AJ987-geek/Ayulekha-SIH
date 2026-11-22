# AyuLekha

A multilingual patient-history interviewer and local medical document digitizer. The React frontend provides the OPD intake interface, 3-stage Voice AI assistant, and SQLite Audit Trail; the Python FastAPI backend runs the clinical interview state machine and **100% Local Medical OCR (`PaddleOCR-VL-1.6`, `PaddleOCR`, and `TrOCR`)** with zero external OCR API keys.

---

## Prerequisites

- **Node.js** 20 or newer
- **Python** 3.11 or newer
- **Groq API Key** (used only for the Socrates Voice-AI clinical conversation; **OCR runs 100% locally without any API keys**)

---

## Local OCR Setup & Model Download Guide (`PaddleOCR-VL-1.6`)

AyuLekha uses a **100% local OCR pipeline** so patient prescriptions and diagnostic lab reports never require external Vision API keys. All model weights are stored locally inside `backend/data/.ocr_cache`.

### 1. Install Python Dependencies for Local OCR (with NVIDIA GPU CUDA Acceleration)

Open PowerShell inside `Ayulekha-SIH/backend` and install the required packages:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m pip install "paddleocr[doc-parser]>=3.7.0" "paddlex>=3.4.0" pymupdf opencv-python-headless pillow transformers
```

#### Enable NVIDIA RTX GPU (CUDA) Acceleration (Recommended for RTX 30/40 Series GPUs)
By default, standard `pip install torch paddlepaddle` installs CPU-only wheels (`torch+cpu`). To unlock your **NVIDIA RTX GPU (`gpu:0` / `cuda:0`)** for **10x–20x faster OCR** (including GPU-accelerated `PaddleOCR-VL-1.6` and FP16 `TrOCR`), run:

```powershell
# 1. Install PyTorch with CUDA 12.6 support for NVIDIA RTX GPU
python -m pip install --upgrade torch torchvision --index-url https://download.pytorch.org/whl/cu126

# 2. Install PaddlePaddle-GPU with CUDA 12.6 support
python -m pip uninstall -y paddlepaddle
python -m pip install paddlepaddle-gpu==3.0.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
```
*(The OCR service automatically detects `paddle.device.is_compiled_with_cuda()` and `torch.cuda.is_available()` and binds all models to `gpu:0` / `cuda:0`.)*

### 2. Download Local `PaddleOCR-VL-1.6`, `PaddleOCR`, and `TrOCR` Models

We provide a dedicated downloader script (`backend/download_ocr_models.py`) that configures `PADDLE_PDX_CACHE_HOME` inside `backend/data/.ocr_cache` (preventing Windows permission errors on `C:\Users\<User>\.paddlex`) and downloads the local model weights:

* **Download All Local OCR Models (`PaddleOCR-VL-1.6` + `PaddleOCR` + `TrOCR`)**:
  ```powershell
  cd backend
  python download_ocr_models.py --engine all
  ```

* **Or Download Specific Local Engines Individually**:
  ```powershell
  # 1. Download ONLY PaddleOCR-VL-1.6 (Vision-Language Document & Table Parser)
  python download_ocr_models.py --engine paddle-vl

  # 2. Download ONLY PaddleOCR (Fast Local Printed Text Detection & Recognition)
  python download_ocr_models.py --engine paddle

  # 3. Download ONLY Microsoft TrOCR (Local Handwritten Prescription Model)
  python download_ocr_models.py --engine trocr
  ```

### 3. How the Local OCR Pipeline Works

1. **`PaddleOCR-VL-1.6` (`PaddleOCRVL(pipeline_version="v1.6")`)**:
   * Primary vision-language document parser for complex medical layouts, lab test tables, and prescriptions. Outputs structured Markdown directly.
2. **`PaddleOCR` (`PP-OCRv4/v5`) + OpenCV Multi-Candidate Pre-processing**:
   * Applies CLAHE contrast enhancement, bilateral denoising, and adaptive thresholding to camera images and extracts printed lines across English and Devanagari (Hindi).
3. **`Microsoft TrOCR` (`microsoft/trocr-base-handwritten`)**:
   * Local Transformer OCR specialized in cursive handwritten prescription lines.
4. **`PyMuPDF` (`pymupdf`) + Local Deterministic Clinical Parser**:
   * Extracts embedded PDF text directly and parses prescriptions (`| # | Medication | Dosage / Strength | Frequency | Duration | Instructions |`) and lab panels (`| Test | Value | Unit | Reference Range | Status |`) completely offline.

---

## Running the Application

Open two PowerShell terminals in the `Ayulekha-SIH` folder:

### Terminal 1 — Python FastAPI Backend (Port 8000)

```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

The API is available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).

### Terminal 2 — Frontend & Express Dev Servers (Ports 5173 / 5174)

```powershell
npm install
npm run dev
```

Open the Patient Portal at `http://localhost:5173`.

---

## End-to-End Clinical Workflow

1. **🎙️ Record Story (3-Stage Voice AI)**:
   * **Stage 1 (STT)**: Real-time speech-to-text with noise suppression streams your spoken symptoms into the input box.
   * **Stage 2 (LLM)**: Socrates clinical interviewer asks targeted follow-up questions with zero repeated domains.
   * **Stage 3 (TTS)**: Native browser WebTTS speaks each question aloud.
2. **📁 Add Documents (or Skip)**:
   * Upon completing the interview, the summary is automatically logged to SQLite (`backend/data/ayulekha.db`) and you are redirected to **Add Documents**.
   * Upload prescriptions or lab reports for local OCR digitization, or click **`⏭️ Skip & Continue to Audit Logs →`**.
3. **📜 System Audit Trail (SQLite Local Storage)**:
   * Displays minimalist audit log thumbnails (`summary_id` and `time_created`).
   * Click **`Open →`** to inspect the **Summary Section** (9-section deep clinical report) and **Documents Section** (both **Original Attached Documents** and **OCR Digitized Documents**).
   * Click **`✏️ Edit / Add Documents`** on any Audit Log to upload and attach additional documents with live local OCR at any time later.
