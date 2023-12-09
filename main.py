from fastapi import FastAPI, Request, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps
import uvicorn
import style
import os
import uuid

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="./static/templates")


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
    
    
@app.post("/")
async def transfer(style_index: str = Form(...), file: UploadFile = File(...)):
    result = None
    error = None

    try:
        unique_filename = str(uuid.uuid4()) + ".png"
        temp_file = f"./static/images/content-images/{unique_filename}"

        with Image.open(file.file) as img:
            img = ImageOps.exif_transpose(img)
            img.save(temp_file)

        result = style.get_result(temp_file, int(style_index))

        final_file = f"./static/images/content-images/{unique_filename}"
        os.rename(temp_file, final_file)
    except Exception as ex:
        error = str(ex)
    finally:
        file.file.close()

    return {"result": result, "error": error}


if __name__ == "__main__":
    uvicorn.run(app="main:app", host="0.0.0.0", port=8000, reload=True, timeout-keep-alive=60)
