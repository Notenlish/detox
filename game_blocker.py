import psutil
import time
import os

BLOCKED_GAMES = [
    "steam.exe",
    "epicgameslauncher.exe",
    "fortnite.exe",
    "valorant.exe",
    "csgo.exe",
    "minecraft.exe",
    "gta5.exe",
    "eldenring.exe",
    "EpicWebHelper.exe",
]


def close_games():
    """Checks running processes and closes any game in the blocked list."""
    for process in psutil.process_iter(attrs=["pid", "name"]):
        try:
            name = process.info["name"].lower()
            if name in BLOCKED_GAMES:
                print(f"Closing {name} (PID {process.info['pid']})")
                os.kill(process.info["pid"], 9)  # Force close process
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue


if __name__ == "__main__":
    while True:
        close_games()
        time.sleep(15)
