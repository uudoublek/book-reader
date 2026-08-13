# book-reader — 结构化书籍 → HTML 电子书站点
#
# 目标一览：
#   make build    生成内容数据 + vite 打包到 dist/
#   make dev      生成内容数据 + 启动 vite dev server
#   make sync     把上游 skills 拷贝到 content/skills/（供独立仓库发布）
#   make clean    删除生成物
#   make preview  本地预览打包产物
#   make deploy   构建并（可选）提交 gh-pages

# 上游书籍来源目录（相对本项目根）。默认指向仓库根的 .reasonix/skills，
# 可用环境变量覆盖：make build SKILLS_DIR=/path/to/skills
SKILLS_DIR ?= ../.reasonix/skills

NPM     ?= npm
NODE    ?= node
CONTENT := src/content/books.json

.PHONY: all build dev sync clean preview deploy content

all: build

## 生成内容数据（markdown -> books.json）
content:
	SKILLS_DIR="$(SKILLS_DIR)" $(NODE) scripts/build-content.mjs

## 完整构建
build: content
	$(NPM) run build:vite -- --emptyOutDir

## 开发模式（先生成数据再起 dev server）
dev: content
	$(NPM) run dev:vite

## 同步上游书籍内容到本仓库（便于把书籍内容一并纳入 git，独立发布）
sync:
	@mkdir -p content/skills
	@rm -rf content/skills/*
	@cp -R "$(SKILLS_DIR)"/. content/skills/
	@echo "已同步 $(SKILLS_DIR) -> content/skills/"

## 本地预览构建产物
preview: build
	$(NPM) run preview

## 清理生成物
clean:
	rm -rf dist src/content/books.json

deploy: build
	@echo "构建完成。GitHub Pages 由 .github/workflows/deploy.yml 自动发布。"
	@echo "若需手动发布到 gh-pages 分支，请使用 peaceiris/actions-gh-pages 或本地 gh-pages 工具。"
