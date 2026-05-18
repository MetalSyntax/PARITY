.PHONY: all build-web android ios start clean

WEB_DIR         = ../web
ANDROID_ASSETS  = ./android/app/src/main/assets/web

all: android

# Build web app with relative paths (file:// compatible) and copy to Android assets
build-web:
	@echo "==> Building web app for mobile..."
	cd $(WEB_DIR) && pnpm exec vite build --mode mobile
	@echo "==> Copying to Android assets..."
	rm -rf $(ANDROID_ASSETS)
	mkdir -p $(ANDROID_ASSETS)
	cp -R $(WEB_DIR)/dist/. $(ANDROID_ASSETS)/
	@echo "==> Done. Web assets at $(ANDROID_ASSETS)"

# Full native Android build (build web first, then compile & launch)
android: build-web
	npx expo run:android

# Start Metro only (web already built — use when iterating on native shell only)
start:
	npx expo start --clear

# Start with fresh web build
start-full: build-web
	npx expo start --clear

clean:
	rm -rf $(ANDROID_ASSETS)
	rm -rf $(WEB_DIR)/dist
