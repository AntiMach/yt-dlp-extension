import fastapi
import uvicorn
import yt_dlp
import asyncio
import ssl


async def dl_merge(video_url: str, audio_url: str):
    subproc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i",
        video_url,
        "-i",
        audio_url,
        "-c",
        "copy",
        "-f",
        "matroska",
        "pipe:1",
        stdin=asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )

    while not subproc.stdout.at_eof():
        chunk = await subproc.stdout.read(1024)
        if not chunk:
            break
        yield chunk


app = fastapi.FastAPI()

certfile = "fullchain.pem"
keyfile = "privkey.pem"

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile, keyfile=keyfile)


@app.get("/")
def root():
    return {"version": "1.0.0"}


@app.get("/download/")
async def stream_video(url: str = ""):
    with yt_dlp.YoutubeDL({"format": "best"}) as client:
        data = client.extract_info(url, download=False)

        formats = data.get("formats", [])

        video_url = next(
            (f["url"] for f in reversed(formats) if f.get("vcodec", "none") != "none"),
            None,
        )

        audio_url = next(
            (f["url"] for f in reversed(formats) if f.get("acodec", "none") != "none"),
            None,
        )

        filename = f"{data['channel']} - {data['title']} [{data['id']}].mkv"
        filename = "".join(c if ord(c) in range(256) else "_" for c in filename)

        if video_url is None or audio_url is None:
            return fastapi.Response(status_code=404)

        return fastapi.responses.StreamingResponse(
            dl_merge(video_url, audio_url),
            media_type="video/x-matroska",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, ssl_certfile=certfile, ssl_keyfile=keyfile)
