@echo off
echo Setting up QueueLess AI Engine...
echo.

python -m venv venv
call venv\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt

echo.
echo Setup complete! 
echo To run the AI Engine, use:
echo call venv\Scripts\activate.bat
echo uvicorn main:app --reload --port 8000
echo.
pause
