# Mockup HTML Patterns

HTML + Alpine.js component patterns for interactive mockups.

## Base HTML Template

```html
<!DOCTYPE html>
<html lang="en" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — Flow Name</title>
  <link rel="stylesheet" href="./output.css">
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
</head>
<body class="bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50 min-h-screen">
  <!-- header, main, footer here -->
</body>
</html>
```

## Dark Mode Toggle

```html
<div x-data="{ dark: localStorage.getItem('theme') === 'dark' }"
     x-init="$watch('dark', v => { document.documentElement.classList.toggle('dark', v); localStorage.setItem('theme', v ? 'dark' : 'light') })">
  <button @click="dark = !dark"
          class="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700">
    <span x-show="!dark">Dark</span>
    <span x-show="dark">Light</span>
  </button>
</div>
```

## Tabs

```html
<div x-data="{ tab: 'general' }">
  <nav class="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
    <button @click="tab = 'general'"
            :class="tab === 'general' ? 'border-primary-500 text-primary-500' : 'border-transparent'"
            class="px-4 py-2 border-b-2 font-medium">General</button>
    <button @click="tab = 'settings'"
            :class="tab === 'settings' ? 'border-primary-500 text-primary-500' : 'border-transparent'"
            class="px-4 py-2 border-b-2 font-medium">Settings</button>
  </nav>
  <div x-show="tab === 'general'" class="p-4">General content</div>
  <div x-show="tab === 'settings'" class="p-4">Settings content</div>
</div>
```

## Modal

```html
<div x-data="{ open: false }">
  <button @click="open = true" class="px-4 py-2 bg-primary-500 text-white rounded-lg">Open</button>
  <div x-show="open" x-transition class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/50" @click="open = false"></div>
    <div class="relative bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-lg font-semibold mb-4">Modal Title</h2>
      <p class="text-neutral-600 dark:text-neutral-300 mb-6">Modal content here.</p>
      <div class="flex justify-end gap-3">
        <button @click="open = false" class="px-4 py-2 rounded-lg border border-neutral-300">Cancel</button>
        <button @click="open = false" class="px-4 py-2 bg-primary-500 text-white rounded-lg">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

## Dropdown

```html
<div x-data="{ open: false }" class="relative">
  <button @click="open = !open" class="px-4 py-2 border rounded-lg flex items-center gap-2">
    Options <span :class="open ? 'rotate-180' : ''" class="transition-transform">&#9662;</span>
  </button>
  <div x-show="open" @click.away="open = false" x-transition
       class="absolute mt-1 w-48 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg z-10">
    <a href="#" class="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">Option 1</a>
    <a href="#" class="block px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">Option 2</a>
  </div>
</div>
```

## Accordion

```html
<div x-data="{ active: null }">
  <div class="border rounded-lg divide-y">
    <div>
      <button @click="active = active === 1 ? null : 1"
              class="w-full px-4 py-3 text-left font-medium flex justify-between items-center">
        Section 1 <span :class="active === 1 ? 'rotate-180' : ''" class="transition-transform">&#9662;</span>
      </button>
      <div x-show="active === 1" x-transition class="px-4 pb-3 text-neutral-600 dark:text-neutral-300">Content 1</div>
    </div>
  </div>
</div>
```

## Form with Validation States

```html
<form x-data="{ email: '', submitted: false }" @submit.prevent="submitted = true">
  <div class="mb-4">
    <label for="email" class="block text-sm font-medium mb-1">Email</label>
    <input id="email" type="email" x-model="email"
           class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  dark:bg-neutral-800 dark:border-neutral-600"
           :class="submitted && !email ? 'border-red-500' : 'border-neutral-300'"
           placeholder="you@example.com">
    <p x-show="submitted && !email" class="text-red-500 text-sm mt-1">Email is required</p>
  </div>
  <button type="submit"
          class="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
    Submit
  </button>
</form>
```

## Cards

```html
<!-- Content card -->
<div class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
  <h3 class="text-lg font-semibold mb-2">Card Title</h3>
  <p class="text-neutral-600 dark:text-neutral-300">Card content.</p>
</div>

<!-- Stat card -->
<div class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border p-6">
  <p class="text-sm text-neutral-500 dark:text-neutral-400">Total Users</p>
  <p class="text-3xl font-bold mt-1">12,345</p>
  <p class="text-sm text-green-600 mt-2">+12% from last month</p>
</div>
```

## Responsive Data Table

```html
<div class="overflow-x-auto">
  <table class="w-full text-left">
    <thead class="bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-500">
      <tr>
        <th class="px-4 py-3 font-medium">Name</th>
        <th class="px-4 py-3 font-medium">Status</th>
        <th class="px-4 py-3 font-medium">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
      <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        <td class="px-4 py-3">Item Name</td>
        <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span></td>
        <td class="px-4 py-3"><button class="text-primary-500 hover:underline text-sm">Edit</button></td>
      </tr>
    </tbody>
  </table>
</div>
```
