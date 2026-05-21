.PHONY: all help build-web start android-dev android-release apk-debug apk-release aab-release clean

WEB_DIR         = ../web
ANDROID_DIR     = ./android
ANDROID_ASSETS  = $(ANDROID_DIR)/app/src/main/assets/web

all: help

help:
	@echo "PARITY Mobile Build System"
	@echo "-------------------------"
	@echo "Web Build Tasks:"
	@echo "  make build-web        - Build web app and sync to Android assets (includes .env)"
	@echo ""
	@echo "Expo Commands (With Expo CLI):"
	@echo "  make start            - Start Metro bundler"
	@echo "  make android-dev      - Run on Android (Debug variant via Expo)"
	@echo "  make android-release  - Run on Android (Release variant via Expo)"
	@echo ""
	@echo "Native Commands (Direct Gradle - 'Sin Expo'):"
	@echo "  make apk-debug        - Generate local Debug APK"
	@echo "  make apk-release      - Generate local Release APK (Production)"
	@echo "  make aab-release      - Generate local Release AAB (Play Store)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Clean build artifacts and Android project"

# Internal: Build web app and copy assets
build-web:
	@echo "==> Building web app for mobile..."
	cd $(WEB_DIR) && pnpm exec vite build --mode mobile
	@echo "==> Copying to Android assets..."
	rm -rf $(ANDROID_ASSETS)
	mkdir -p $(ANDROID_ASSETS)
	cp -R $(WEB_DIR)/dist/. $(ANDROID_ASSETS)/
	@if [ -f $(WEB_DIR)/.env ]; then \
		echo "==> Copying .env to Android assets..."; \
		cp $(WEB_DIR)/.env $(ANDROID_ASSETS)/.env; \
	fi
	@echo "==> Done. Web assets at $(ANDROID_ASSETS)"

# Expo standard commands
start:
	npx expo start --clear

android-dev: build-web
	npx expo run:android

android-release: build-web
	npx expo run:android --variant release

# Direct Gradle commands (Native APK/AAB)
apk-debug: build-web
	cd $(ANDROID_DIR) && ./gradlew assembleDebug

apk-release: build-web
	cd $(ANDROID_DIR) && ./gradlew assembleRelease

aab-release: build-web
	cd $(ANDROID_DIR) && ./gradlew bundleRelease

clean:
	rm -rf $(ANDROID_ASSETS)
	rm -rf $(WEB_DIR)/dist
	cd $(ANDROID_DIR) && ./gradlew clean
