# 1. Use the official Playwright image (Ubuntu-based) as the foundation
# It comes pre-installed with browser binaries and system-level dependencies.
FROM mcr.microsoft.com/playwright:v1.58.1-jammy

# 2. Install system packages for Locales and Networking
# We need 'locales' for Russian support and 'curl' for your connectivity spike.
RUN apt-get update && apt-get install -y \
    locales \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 3. Configure Russian Locale (ru_RU.UTF-8)
# This prevents '????' characters when handling Russian names in your PatientFactory.
RUN locale-gen ru_RU.UTF-8 \
    && update-locale LANG=ru_RU.UTF-8

# Set environment variables so the system and Node.js use the locale by default.
ENV LANG=ru_RU.UTF-8
ENV LANGUAGE=ru_RU:ru
ENV LC_ALL=ru_RU.UTF-8

# 4. Set the working directory inside the container
WORKDIR /app

# 5. Copy package manifests and install dependencies
# We do this before copying the code to leverage Docker's layer caching.
COPY package*.json ./
RUN npm install

# 6. Copy the rest of the application code
COPY . .

# 7. (Optional) Set the default command to run tests
# This can be overridden when running the container manually.
CMD ["npx", "playwright", "test"]