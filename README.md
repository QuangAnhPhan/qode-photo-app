# Qode Take-home Assignment – Photo Upload and Comment App

## Overview
A small full-stack web application allows users to:

- upload a photo
- add comments to a photo
- display all uploaded photos with their comments

## Tech Stack

- **Frontend:** Next.js, TypeScript, Ant Design
- **Backend:** Next.js API Routes 
- **Database:** PostgreSQL
- **Database client:** `pg`

## Features

- Upload a photo
- Add a comment to a photo
- Display all uploaded photos and comments
- Delete a photo along with its comments

## Instructions

1. Clone the repository from Github
2. Install dependencies: `npm install`
3. Create a local PostgreSQL database named `qode_photo_app`
4. Run the database initialization script `sql/init.sql` against the `qode_photo_app` database with pgAdmin or psql
5. Create a `.env.local` file in the project root and add `DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/qode_photo_app`
6. Replace `postgres` and `yourpassword` with your actual PostgreSQL username and password
7. Start the application: `npm run dev`
8. Open `http://localhost:3000` in your browser
