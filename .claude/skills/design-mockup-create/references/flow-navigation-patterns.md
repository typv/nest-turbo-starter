# Flow Navigation Patterns

Multi-page flow patterns for linked HTML mockups. All links use relative paths — no server required.

## Page Linking

Always use relative links within a flow directory:

```html
<a href="./login.html">Login</a>
<a href="./register.html">Register</a>
<a href="./index.html">Back to Overview</a>
```

## Active Page Highlighting

Use Alpine.js to detect the current page and highlight the active nav link:

```html
<nav x-data="{ current: window.location.pathname.split('/').pop() || 'index.html' }"
     class="flex gap-4">
  <a href="./index.html"
     :class="current === 'index.html' ? 'text-primary-500 font-semibold' : 'text-neutral-600 dark:text-neutral-300'"
     class="hover:text-primary-500 transition-colors">Home</a>
  <a href="./dashboard.html"
     :class="current === 'dashboard.html' ? 'text-primary-500 font-semibold' : 'text-neutral-600 dark:text-neutral-300'"
     class="hover:text-primary-500 transition-colors">Dashboard</a>
</nav>
```

## Breadcrumb Navigation

```html
<nav aria-label="Breadcrumb" class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
  <ol class="flex items-center gap-2">
    <li><a href="./index.html" class="hover:text-primary-500">Home</a></li>
    <li>/</li>
    <li><a href="./settings.html" class="hover:text-primary-500">Settings</a></li>
    <li>/</li>
    <li class="text-neutral-900 dark:text-neutral-100 font-medium">Profile</li>
  </ol>
</nav>
```

## Progress / Step Indicator

For multi-step flows (onboarding, checkout, wizards):

```html
<nav aria-label="Progress" class="mb-8"
     x-data="{ currentStep: 2, steps: ['Account', 'Profile', 'Confirm'] }">
  <ol class="flex items-center">
    <template x-for="(step, i) in steps" :key="i">
      <li class="flex items-center" :class="i < steps.length - 1 ? 'flex-1' : ''">
        <div class="flex items-center gap-2">
          <span :class="{
                  'bg-primary-500 text-white': i + 1 <= currentStep,
                  'bg-neutral-200 text-neutral-500 dark:bg-neutral-700': i + 1 > currentStep
                }"
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                x-text="i + 1"></span>
          <span class="text-sm font-medium hidden sm:inline"
                :class="i + 1 <= currentStep ? 'text-primary-500' : 'text-neutral-400'"
                x-text="step"></span>
        </div>
        <div x-show="i < steps.length - 1"
             class="flex-1 h-0.5 mx-4"
             :class="i + 1 < currentStep ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"></div>
      </li>
    </template>
  </ol>
</nav>
```

## Back / Next Navigation

Sequential flow navigation buttons:

```html
<div class="flex justify-between items-center pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
  <a href="./step-1.html"
     class="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
            hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
    &larr; Back
  </a>
  <a href="./step-3.html"
     class="px-4 py-2 bg-primary-500 text-white rounded-lg
            hover:bg-primary-600 transition-colors">
    Next &rarr;
  </a>
</div>
```

## Index Page (Flow Entry Point)

Overview page that links to all flow pages with descriptions:

```html
<main class="max-w-3xl mx-auto px-4 py-12">
  <h1 class="text-3xl font-bold mb-2">Flow Name</h1>
  <p class="text-neutral-600 dark:text-neutral-300 mb-8">Flow description from mockup.json.</p>

  <div class="space-y-3">
    <a href="./login.html"
       class="block p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200
              dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600
              transition-colors group">
      <h2 class="font-semibold group-hover:text-primary-500 transition-colors">Login</h2>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Email/password login with social auth options</p>
    </a>
    <a href="./register.html"
       class="block p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200
              dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600
              transition-colors group">
      <h2 class="font-semibold group-hover:text-primary-500 transition-colors">Register</h2>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Create a new account</p>
    </a>
  </div>
</main>
```

## Consistent Header / Footer

Replicate on every page in the flow:

```html
<!-- Header (top of <body>) -->
<header class="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
    <a href="./index.html" class="font-bold text-lg">App Name</a>
    <nav x-data="{ current: window.location.pathname.split('/').pop() || 'index.html' }"
         class="hidden md:flex gap-6 text-sm">
      <!-- nav links with active highlight -->
    </nav>
  </div>
</header>

<!-- Footer (bottom of <body>, before </body>) -->
<footer class="border-t border-neutral-200 dark:border-neutral-700 mt-auto">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-neutral-500">
    Mockup &mdash; generated from design system tokens
  </div>
</footer>
```
