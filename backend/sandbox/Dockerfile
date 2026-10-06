FROM node:20-alpine
# sandbox for student code - no network, limited resources
RUN adduser -D runner
WORKDIR /home/runner
COPY run.js .
RUN npm init -y && npm install playwright-core@1.44.0 || true
USER runner
ENTRYPOINT ["node", "run.js"]
