<script setup lang="ts">
import { auth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

definePage({
  name: 'VerifyEmail',
  meta: {
    requiresAuth: false,
  },
});

const router = useRouter();
const error = ref('');
const resendCooldown = ref(0);

function startCooldown() {
  resendCooldown.value = 60;
  const timer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}

async function resendVerificationEmail() {
  if (resendCooldown.value > 0 || !auth.currentUser) {
    return;
  }

  try {
    await sendEmailVerification(auth.currentUser, {
      url: `${window.location.origin}/login`,
    });
    startCooldown();
  }
  catch (error: any) {
    error.value = 'Failed to resend verification email. Please try again later.';
  }
}

// Check verification status periodically
let checkInterval: number | undefined;
onMounted(() => {
  checkInterval = window.setInterval(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        clearInterval(checkInterval);
        router.push('/');
      }
    }
  }, 5000);
});

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Verify Your Email
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          We've sent you a verification email. Please check your inbox and click the verification link.
        </p>
      </div>
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500">
          Didn't receive the email?
          <button
            class="ml-2 font-medium text-indigo-600 hover:text-indigo-500"
            :disabled="resendCooldown > 0"
            @click="resendVerificationEmail"
          >
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend' }}
          </button>
        </p>
        <div v-if="error" class="mt-4 text-sm text-red-600">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
