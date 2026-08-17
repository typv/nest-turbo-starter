# Responsive Layout Patterns

Tailwind CSS mobile-first layout patterns for mockups.

## Grid Layouts

```html
<!-- 1-col → 2-col → 3-col -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Item</div>
</div>

<!-- 1-col → 2-col → 4-col -->
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
  <div>Item</div>
</div>
```

## Sidebar Layout

```html
<!-- Hidden sidebar on mobile, fixed on desktop -->
<div class="flex min-h-screen" x-data="{ sidebarOpen: false }">
  <!-- Mobile overlay -->
  <div x-show="sidebarOpen" class="fixed inset-0 bg-black/50 z-40 lg:hidden" @click="sidebarOpen = false"></div>

  <!-- Sidebar -->
  <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
         class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-800 border-r
                transform transition-transform lg:translate-x-0 lg:static lg:z-auto">
    <div class="p-4 border-b">
      <h2 class="font-semibold text-lg">App Name</h2>
    </div>
    <nav class="p-4 space-y-1">
      <a href="#" class="block px-3 py-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium">Dashboard</a>
      <a href="#" class="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">Settings</a>
    </nav>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col min-w-0">
    <header class="flex items-center gap-4 px-4 py-3 border-b lg:px-6">
      <button @click="sidebarOpen = true" class="lg:hidden p-2 rounded-lg hover:bg-neutral-100">&#9776;</button>
      <h1 class="text-xl font-semibold">Page Title</h1>
    </header>
    <main class="flex-1 p-4 lg:p-6">
      <!-- Page content -->
    </main>
  </div>
</div>
```

## Navigation Patterns

```html
<!-- Hamburger mobile → horizontal desktop -->
<header class="bg-white dark:bg-neutral-800 border-b" x-data="{ mobileNav: false }">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="./index.html" class="font-bold text-lg">Logo</a>
      <!-- Desktop nav -->
      <nav class="hidden md:flex gap-6">
        <a href="./page-1.html" class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">Page 1</a>
        <a href="./page-2.html" class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">Page 2</a>
      </nav>
      <!-- Mobile hamburger -->
      <button @click="mobileNav = !mobileNav" class="md:hidden p-2">&#9776;</button>
    </div>
    <!-- Mobile nav -->
    <nav x-show="mobileNav" class="md:hidden pb-4 space-y-2">
      <a href="./page-1.html" class="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">Page 1</a>
      <a href="./page-2.html" class="block px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">Page 2</a>
    </nav>
  </div>
</header>
```

## Dashboard Layout

```html
<!-- Stacked mobile → grid desktop with sidebar -->
<main class="p-4 lg:p-6">
  <!-- Stats row -->
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
    <div class="bg-white dark:bg-neutral-800 rounded-xl border p-4">
      <p class="text-sm text-neutral-500">Metric</p>
      <p class="text-2xl font-bold">1,234</p>
    </div>
  </div>
  <!-- Content area -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border p-6">
      <h2 class="font-semibold mb-4">Main Content</h2>
    </div>
    <div class="bg-white dark:bg-neutral-800 rounded-xl border p-6">
      <h2 class="font-semibold mb-4">Sidebar Widget</h2>
    </div>
  </div>
</main>
```

## Auth Layout

```html
<!-- Centered card mobile → split-screen desktop -->
<div class="min-h-screen flex">
  <!-- Left panel (hidden mobile, visible desktop) -->
  <div class="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center p-12">
    <div class="text-white max-w-md">
      <h1 class="text-4xl font-bold mb-4">Welcome Back</h1>
      <p class="text-primary-100 text-lg">Sign in to continue to your dashboard.</p>
    </div>
  </div>
  <!-- Right panel (form) -->
  <div class="flex-1 flex items-center justify-center p-6">
    <div class="w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-6 lg:hidden">Welcome Back</h2>
      <!-- form content -->
    </div>
  </div>
</div>
```

## Container Patterns

```html
<!-- Standard page container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- content -->
</div>

<!-- Narrow content container (articles, forms) -->
<div class="max-w-2xl mx-auto px-4 sm:px-6">
  <!-- content -->
</div>
```

## Responsive Image/Media

```html
<!-- Responsive aspect ratio -->
<div class="aspect-video rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
  <img src="https://placehold.co/800x450" alt="Placeholder" class="w-full h-full object-cover">
</div>

<!-- Avatar -->
<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
  AB
</div>
```
