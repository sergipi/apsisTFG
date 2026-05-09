# Apsis

Frontend prototype for the  Apsis IT application.

- [Node.js] Can be dowloaded at: https://nodejs.org/

1. Install dependencies:

npm install

2. Start the development server:

npm run dev

3. Open the URL shown in the terminal (mine is http://localhost:5173).

On the login screen, type one of these usernames (any password works):

- itadmin → IT Administrator dashboard
- viewer → Auditor / Viewer dashboard
- Any other name or the default → Employee requester dashboard

docker run --name apsis-db -e POSTGRES_DB=apsis_db -e POSTGRES_PASSWORD=Admin123! -p 5432:5432 -d postgres & pip install -r requirements.txt & python manage.py migrate & python manage.py loaddata data2.json & python manage.py runserver


