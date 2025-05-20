 
 
 npm run migrate:dev -- --name user init

 docker-compose exec postgres psql -U postgres -d social
 psql -U postgres -d social


 docker exec -it <container_id_or_name> bash
 bin/elasticsearch-service-tokens create elastic/kibana kibana-token


 docker-compose --env-file .env up -d

 docker network create kafka-network
 git filter-repo --path .env.development --invert-paths
 git filter-repo --path .env --path .env.development --path .env.production --path .env.sa --invert-paths --force
 
 docker build -t auth:local -f apps/auth/Dockerfile .

 docker compose -f 'docker-compose.yml' up --build 'container'
 docker compose -f 'docker-compose.yml' down kibana