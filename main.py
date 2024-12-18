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
app.mount("/images", StaticFiles(directory="images"), name="images")
templates = Jinja2Templates(directory="./static/templates")


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
    
    
@app.post("/")
async def transfer(style_index: str = Form(...), file: UploadFile = File(...)):
    result = None
    error = None

    try:
        unique_filename = str(uuid.uuid4())
        temp_file = f"./static/images/content-images/{unique_filename}" + ".png"

        with Image.open(file.file) as img:
            img = ImageOps.exif_transpose(img)
            img.save(temp_file)

        result = style.get_result(unique_filename, temp_file, int(style_index))

        if os.path.exists(temp_file):
            os.remove(temp_file)

        return {"result": result, "error": error}

    except Exception as ex:
        return {"error": str(ex)}
    finally:
        file.file.close()


if __name__ == "__main__":
    uvicorn.run(app="main:app", host="0.0.0.0", port=8000, reload=True, timeout_keep_alive=60)
