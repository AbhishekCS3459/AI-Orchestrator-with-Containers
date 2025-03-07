# Data Processing & Sentiment Analysis Application
### Live Demo : https://drive.google.com/file/d/195m9mv9TlXIacrMVpGA3Bc4-MJOS1NaM/view?usp=sharing 
## Overview
This application processes user-provided input to determine whether a task is related to sentiment analysis or data cleaning. It then executes the corresponding Docker container to perform the task efficiently. The project integrates Groq's AI models for task detection and uses AWS S3 for data storage.

## Features
- **Task Identification:** Uses Groq AI to classify user input into "sentiment analysis" or "data cleaning."
- **Sentiment Analysis:** Runs a Docker container that evaluates user input and returns a sentiment score.
- **Data Cleaning:** Processes CSV files by standardizing column names, trimming whitespace, and validating email formats.
- **AWS S3 Integration:** Downloads raw datasets from S3 and uploads cleaned files back.
- **Docker Integration:** Ensures modular execution of tasks.

## Tech Stack
- **Backend:** Node.js (with TypeScript support)
- **AI Model:** Groq's Llama-3.3-70b-versatile
- **Containers:** Docker for sentiment analysis and data cleaning
- **Database & Storage:** AWS S3 for file handling
- **Cloud Services:** AWS IAM for authentication

## Project Structure
```
.
├── server.js  # Main application file handling user input
├── docker.js  # Docker execution scripts for tasks
├── datacleaning/  # Data cleaning logic (Python + Pandas)
│   ├── app.py  # Implements cleaning operations
│   └── Dockerfile  # Defines the container for execution
├── sentimental_analysis/  # Sentiment analysis logic
│   ├── sentimental_analysis.py  # Implements sentiment scoring
│   └── Dockerfile  # Defines the container for execution
├── .env  # Stores environment variables
├── package.json  # Node.js dependencies
└── README.md  # This file
```

## Setup & Installation
### Prerequisites
- Node.js (v16+)
- Docker (latest version)
- AWS CLI configured with access keys
- An S3 bucket for file storage

### Installation Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/data-processing-app.git
   cd data-processing-app
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables in `.env`:
   ```sh
   GROQ_API_KEY=your_groq_api_key
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_S3_BUCKET_NAME=your_s3_bucket_name
   ```
4. Build and run Docker containers:
   ```sh
   docker build -t sentiment_analysis_container ./sentimental_analysis
   docker build -t data_cleaning_container ./datacleaning
   ```

## Running the Application
To start the application:
```sh
node server.js
```

You will be prompted to enter a message. The AI will detect the task and execute the corresponding Docker container.

## API Flow
1. **User Input:** Prompt for a message like "Analyze this text: 'I love this product!'" or "Clean this dataset uncleaned.csv."
2. **Task Identification:** Groq AI categorizes input into `sentiment_analysis` or `data_cleaning`.
3. **Docker Execution:**
   - If `sentiment_analysis`, runs `analyze.py` in a container.
   - If `data_cleaning`, fetches the file from S3, processes it, and re-uploads it.
4. **Output:**
   - Sentiment analysis returns a sentiment score.
   - Data cleaning generates a cleaned CSV file with a pre-signed download URL.

## Example Usage
```sh
> Enter your message: "Clean this dataset raw_data.csv"
Identified Task: data_cleaning
Filename detected: raw_data.xlsx
📂 Data Cleaning Output: Processed file available at: [S3 Pre-Signed URL]
```

```sh
> Enter your message: "Analyze the sentiment: 'Great product, I love it!'"
Identified Task: sentiment_analysis
📊 Sentiment Score: 0.9 (Positive)
```

## Contributions
Contributions are welcome! Open a pull request for feature additions or improvements.

## License
MIT License

