<template>
  <footer class="bg-white/80 backdrop-blur-sm border-t border-sky-100 mt-auto">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center shadow-sky-sm overflow-hidden"
            style="background:linear-gradient(135deg,#38bdf8,#0ea5e9)">
            <img v-if="appCfg.app_logo" :src="appCfg.app_logo" class="w-full h-full object-cover"
              @error="e => e.target.style.display='none'" />
            <Leaf v-else class="text-white" :size="15" />
          </div>
          <span class="font-bold gradient-text-static">{{ appCfg.app_name || 'EcoScan' }}</span>
          <span class="text-gray-400 text-sm">– Phân loại rác thải thông minh</span>
        </div>

        <div class="flex items-center gap-6 text-sm text-gray-500">
          <RouterLink to="/" class="hover:text-sky-600 transition-colors">Trang chủ</RouterLink>
          <RouterLink to="/classify" class="hover:text-sky-600 transition-colors">Phân loại</RouterLink>
          <RouterLink to="/chat" class="hover:text-sky-600 transition-colors">Hỏi AI</RouterLink>
          <RouterLink to="/download" class="hover:text-sky-600 transition-colors">Tải app</RouterLink>
        </div>

        <p class="text-xs text-gray-400">© 2025 {{ appCfg.app_name || 'EcoScan' }} · Powered by Google Gemini AI</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Leaf } from 'lucide-vue-next'
import { useAppConfig } from '../stores/appConfig'

const { state: appCfg } = useAppConfig()
</script>
