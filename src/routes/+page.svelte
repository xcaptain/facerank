<script lang="ts">
    import "../app.css";
    import { onMount } from 'svelte';
	import { enhance, applyAction } from '$app/forms';

    let fileInput: HTMLInputElement;
    let previewImage: string | null = $state(null);
    let isDragging = $state(false);
    let isLoading = $state(false);
    let result: { score: number; suggestions: string[] } | null = $state(null);
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
        };
        reader.readAsDataURL(file);
    }

    function clearFileInput() {
        if (fileInput) {
            fileInput.value = '';
        }
        previewImage = null;
        result = null;
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
    }

    onMount(() => {
        // 确保 fileInput 引用有效
        if (!fileInput) {
            fileInput = document.getElementById('file-upload') as HTMLInputElement;
        }
    });
</script>

<div class="container mx-auto px-4 py-8 max-w-2xl">
    <header class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">颜值评分</h1>
        <p class="text-base-content/80">上传您的照片，AI将为您提供颜值评分和改进建议</p>
    </header>

    <form method="POST" action="?/analyze" enctype="multipart/form-data" use:enhance={() => {
        isLoading = true;
        return async ({ result }) => {
            if (result.type === 'success') {
                // result.data.result 是后端返回的分析结果, markdown 格式
                console.log('分析结果log:', result.data);
            }
            isLoading = false;
		};
    }}>
        <!-- 上传区域 -->
        <div role="region"
            class="upload-container mb-6 p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200"
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
                        class="mx-auto max-h-80 rounded-lg shadow-md"
                    />
                    <button 
                        aria-label="重置照片"
                        class="btn btn-circle btn-sm absolute top-2 right-2 bg-base-100/80 hover:bg-base-200"
                        onclick={resetAll}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            {:else}
                <label for="file-upload" class="cursor-pointer block py-8">
                    <div class="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-lg font-medium mb-1">点击或拖拽上传照片</p>
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

        <!-- 操作按钮 -->
        <div class="flex justify-center mb-6">
            <button 
                type="submit"
                class="btn btn-primary w-full max-w-xs {previewImage ? '' : 'btn-disabled'}"
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

        <!-- 错误提示 -->
        {#if errorMessage}
            <div class="alert alert-error mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
            </div>
        {/if}

        <!-- 结果展示 -->
        {#if result}
            <div class="result-container p-6 bg-base-200 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    分析结果
                </h2>
                
                <div class="score-container mb-6 flex flex-col items-center">
                    <div class="radial-progress text-primary mb-2" style="--value:{result.score}; --size:8rem; --thickness: 0.8rem;">{result.score}</div>
                    <p class="text-lg font-medium">颜值评分</p>
                </div>
                
                <div class="suggestions-container">
                    <h3 class="text-lg font-medium mb-2">改进建议:</h3>
                    <ul class="list-disc list-inside space-y-1 text-base-content/90">
                        {#each result.suggestions as suggestion}
                            <li>{suggestion}</li>
                        {/each}
                    </ul>
                </div>
            </div>
        {/if}
    </form>

    <footer class="mt-12 text-center text-sm text-base-content/70">
        <p>© {new Date().getFullYear()} 颜值评分工具 - AI仅供娱乐参考</p>
    </footer>
</div>
