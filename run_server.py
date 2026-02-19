import uvicorn
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    try:
        from backend.main import app
        uvicorn.run(app, host="127.0.0.1", port=8080, log_level="info")
    except Exception as e:
        import traceback
        with open("server_crash.log", "w") as f:
            f.write(str(e) + "\n")
            f.write(traceback.format_exc())
        print(f"CRASH: {e}")
        sys.exit(1)
