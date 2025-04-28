<script lang="ts">
    import "../app.css";
    import { onMount } from 'svelte';
    import { enhance, applyAction } from '$app/forms';
    import { marked } from 'marked';

    let fileInput: HTMLInputElement;
    let previewImage: string | null = $state(null);
    let isDragging = $state(false);
    let isLoading = $state(false);
    let result: { score: number; suggestions: string[] } | null = $state(null);
    let markdownResult: string | null = $state(null);
    let errorMessage: string | null = $state(null);

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidImageFile(file)) {
                previewSelectedImage(file);
                errorMessage = null;
            } else {
                errorMessage = "请上传有效的图片文件 (JPG, PNG, WEBP)";
                clearFileInput();
            }
        }
    }

    function isValidImageFile(file: File): boolean {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
    }

    function previewSelectedImage(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage = e.target?.result as string;
            result = null; // 重置之前的结果
            markdownResult = null; // 重置 markdown 结果
        };
        reader.readAsDataURL(file);
    }

    function clearFileInput() {
        if (fileInput) {
            fileInput.value = '';
        }
        previewImage = null;
        result = null;
        markdownResult = null;
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
        
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (isValidImageFile(file)) {
                if (fileInput) {
                    // Create a DataTransfer object and add the file to it
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                }
                previewSelectedImage(file);
                errorMessage = null;
            } else {
                errorMessage = "请上传有效的图片文件 (JPG, PNG, WEBP)";
            }
        }
    }

    function resetAll() {
        clearFileInput();
        errorMessage = null;
        result = null;
        markdownResult = null;
    }

    // 提取分数的辅助函数（从 markdown 中提取数字分数）
    function extractScore(markdown: string) {
        const scoreMatch = markdown.match(/(\d{1,2}(\.\d+)?)(\/\d+)?分/);
        if (scoreMatch) {
            return parseFloat(scoreMatch[1]);
        }
        return null;
    }

    onMount(() => {
        // 确保 fileInput 引用有效
        if (!fileInput) {
            fileInput = document.getElementById('file-upload') as HTMLInputElement;
        }
    });
</script>

<!-- 使用 flex 和 min-h-screen 使页脚保持在底部 -->
<div class="flex flex-col min-h-screen bg-gradient-to-b from-base-100 to-base-200">
    <main class="flex-grow">
        <div class="container mx-auto px-4 py-8 max-w-2xl">
            <!-- 美化标题区域 -->
            <header class="text-center mb-10">
                <div class="bg-primary/10 inline-block rounded-full p-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 class="text-4xl font-bold text-primary mb-2">颜值评分</h1>
                <p class="text-base-content/80">上传您的照片，AI将为您提供颜值评分和改进建议</p>
            </header>

            <form method="POST" action="?/analyze" enctype="multipart/form-data" use:enhance={() => {
                isLoading = true;
                return async ({ result: formResult }) => {
                    if (formResult.type === 'success') {
                        // 保存服务端返回的 markdown 结果
                        markdownResult = formResult.data!.result as string;
                        
                        // 尝试提取分数用于显示在进度条中
                        const score = extractScore(markdownResult);
                        if (score) {
                            result = {
                                score: score,
                                suggestions: [] 
                            };
                        }
                    } else {
                        errorMessage = "分析失败，请稍后重试";
                    }
                    isLoading = false;
                };
            }}>
                <!-- 上传区域 - 美化 -->
                <div role="region"
                    class="upload-container mb-8 p-5 border-2 border-dashed rounded-xl text-center transition-all duration-200 hover:border-primary/70 hover:bg-primary/5"
                    class:border-primary={isDragging}
                    class:border-base-300={!isDragging}
                    ondragover={handleDragOver}
                    ondragleave={handleDragLeave}
                    ondrop={handleDrop}
                >
                    {#if previewImage}
                        <div class="preview-container relative mb-4">
                            <img 
                                src={previewImage} 
                                alt="预览图" 
                                class="mx-auto max-h-80 rounded-lg shadow-lg object-cover"
                            />
                            <button 
                                type="button"
                                aria-label="重置照片"
                                class="btn btn-circle btn-sm absolute top-2 right-2 bg-base-100/90 hover:bg-base-200 shadow-md"
                                onclick={resetAll}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    {:else}
                        <label for="file-upload" class="cursor-pointer block py-10">
                            <div class="flex flex-col items-center">
                                <div class="bg-primary/10 rounded-full p-4 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p class="text-lg font-medium mb-2">点击或拖拽上传照片</p>
                                <p class="text-sm text-base-content/70">支持 JPG、PNG、WEBP 格式</p>
                            </div>
                        </label>
                    {/if}
                    
                    <input 
                        bind:this={fileInput}
                        type="file" 
                        name="file"
                        id="file-upload" 
                        class="hidden" 
                        accept="image/jpeg,image/png,image/webp"
                        onchange={handleFileSelect}
                    />
                </div>

                <!-- 操作按钮 - 美化 -->
                <div class="flex justify-center mb-8">
                    <button 
                        type="submit"
                        class="btn btn-primary w-full max-w-xs shadow-md {previewImage ? '' : 'btn-disabled'} transition-all duration-300"
                        disabled={isLoading || !previewImage}
                    >
                        {#if isLoading}
                            <span class="loading loading-spinner"></span>
                            分析中...
                        {:else}
                            开始分析
                        {/if}
                    </button>
                </div>

                <!-- 错误提示 - 美化 -->
                {#if errorMessage}
                    <div class="alert alert-error mb-8 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                {/if}

                <!-- 结果展示 - 美化 -->
                {#if markdownResult}
                    <div class="result-container p-6 bg-base-100 rounded-xl shadow-lg border border-base-300 animate-fadeIn">
                        <h2 class="text-xl font-semibold mb-6 flex items-center border-b border-base-300 pb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            分析结果
                        </h2>
                        
                        <!-- 分数显示（如果能提取到分数） -->
                        {#if result?.score}
                        <div class="score-container mb-8 flex flex-col items-center">
                            <div class="radial-progress text-primary mb-3 shadow-inner" style="--value:{result.score * 10}; --size:9rem; --thickness: 0.8rem;">
                                <span class="text-2xl font-bold">{result.score}</span>
                            </div>
                            <p class="text-lg font-medium">颜值评分</p>
                        </div>
                        {/if}
                        
                        <!-- 使用 tailwind typography 插件渲染 Markdown -->
                        <div class="prose prose-sm md:prose max-w-none prose-headings:text-primary prose-p:text-base-content/90">
                            {@html marked(markdownResult)}
                        </div>
                    </div>
                {/if}
            </form>
        </div>
    </main>

    <!-- 美化页脚，确保它始终在底部 -->
    <footer class="mt-auto py-6 bg-base-300/30 border-t border-base-300">
        <div class="container mx-auto px-4 text-center">
            <p class="text-sm text-base-content/70">© {new Date().getFullYear()} 颜值评分工具 - AI仅供娱乐参考</p>
        </div>
    </footer>
</div>

<style>
    /* 渐入动画 */
    .animate-fadeIn {
        animation: fadeIn 0.5s ease-in-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
