
FROM mcr.microsoft.com/playwright:v1.44.0-jammy
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx playwright install chromium
RUN npm run build || echo "no build step"
EXPOSE 3001
CMD ["npm","run","dev"]
