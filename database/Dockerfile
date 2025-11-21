FROM postgres:15

# Set environment variables
ENV POSTGRES_USER=fintoc
ENV POSTGRES_PASSWORD=fintoc
ENV POSTGRES_DB=fintoc

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY seed.sql /docker-entrypoint-initdb.d/02-seed.sql

# Expose PostgreSQL port
EXPOSE 5432