
FROM python:3.9-slim


WORKDIR /app

COPY sentiment_analysis.py .


RUN pip install textblob && python -m textblob.download_corpora

ENTRYPOINT ["python", "sentiment_analysis.py"]
