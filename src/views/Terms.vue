<template>
  <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold mb-6">{{ $t('termsAndConditions') }}</h1>
    
    <div class="prose prose-indigo">
      <h2>1. {{ $t('acceptanceOfTerms') }}</h2>
      <p>{{ $t('termsAcceptanceText') }}</p>

      <h2>2. {{ $t('userConduct') }}</h2>
      <p>{{ $t('userConductText') }}</p>

      <h2>3. {{ $t('privacy') }}</h2>
      <p>{{ $t('privacyText') }}</p>

      <h2>4. {{ $t('intellectualProperty') }}</h2>
      <p>{{ $t('intellectualPropertyText') }}</p>

      <h2>5. {{ $t('disclaimerOfWarranties') }}</h2>
      <p>{{ $t('disclaimerOfWarrantiesText') }}</p>

      <h2>6. {{ $t('limitationOfLiability') }}</h2>
      <p>{{ $t('limitationOfLiabilityText') }}</p>

      <h2>7. {{ $t('modificationsToService') }}</h2>
      <p>{{ $t('modificationsToServiceText') }}</p>

      <h2>8. {{ $t('governingLaw') }}</h2>
      <p>{{ $t('governingLawText') }}</p>

      <h2>9. {{ $t('contactInformation') }}</h2>
      <p>{{ $t('contactInformationText') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>