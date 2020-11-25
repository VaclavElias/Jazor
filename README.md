# Jazor

This library helps with very common actions on the website which involve repeating JavaScript across multiple different projects. Click a button or a link, do something in the backend and UI. This library takes an approach rather updating whole HTML blocks than granular tags with JSON and JavaScript libraries.

You might find this useful in certain projects if you want to write minimum or no JavaScript. Still, JavaScript knowledge is required in certain scenarios.
 
There is a crossover with (Blazor)[https://github.com/dotnet/blazor] but you can still use here Partial views heavily. While Blazor is super optimised, here you can load even whole pages.
 
This library is using currently:
 
- TypeScript to handle all common actions workload
- TagHelpers to simplify using **data-** and a bit help with 

## Requirements

1. Add ```jazor.js``` to your Razor page or _Layout.
2. Add ```@addTagHelper *, Jazor``` to your _ViewImports.cshtml


## Example 1
Load multiple delayed HTML / Partial Views.

 - Load News part
 - Load Top News part after 1 second
 - This will load your HTML from your desired url
 
```html
    <div jazor-url="/examples/news">Loading...</div>
    <div jazor-url="@((nameof(ExamplesController), nameof(ExamplesController.TopNews), null))" jazor-delay="1">Loading...</div>
```

## Example 2

Click a button or link to load HTML / Partial Views to your target element.


```html
    <button jazor-click="/examples/itnews" jazor-target="content">Show .NET News</div>
    <button jazor-click="@((nameof(ExamplesController), nameof(ExamplesController.AngularNews), null))" jazor-target="content">Show Angular News</button>

    <div id="content">The content will be loaded here.</div>
```

