docker run --rm --name postgres -e POSTGRES_PASSWORD=password123 -p 5432:5432 -d postgres

sleep 5

PGPASSWORD=password123 psql -h 0.0.0.0 -U postgres -f createTable.sql
