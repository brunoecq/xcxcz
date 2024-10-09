<template>
  <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold mb-6">{{ $t('privacyPolicy') }}</h1>
    
    <div class="prose prose-indigo">
      <h2>{{ $t('informationWeCollect') }}</h2>
      <p>{{ $t('informationWeCollectText') }}</p>

      <h2>{{ $t('howWeUseYourInformation') }}</h2>
      <p>{{ $t('howWeUseYourInformationText') }}</p>

      <h2>{{ $t('informationSharingAndDisclosure') }}</h2>
      <p>{{ $t('informationSharingAndDisclosureText') }}</p>

      <h2>{{ $t('dataSecurity') }}</h2>
      <p>{{ $t('dataSecurityText') }}</p>

      <h2>{{ $t('yourChoices') }}</h2>
      <p>{{ $t('yourChoicesText') }}</p>

      <h2>{{ $t('changesToThisPolicy') }}</h2>
      <p>{{ $t('changesToThisPolicyText') }}</p>

      <h2>{{ $t('contactUs') }}</h2>
      <p>{{ $t('contactUsText') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>