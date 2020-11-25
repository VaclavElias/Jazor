using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System;

namespace Jazor.TagHelpers
{
    [HtmlTargetElement(Attributes = JazorClick)]
    [HtmlTargetElement(Attributes = JazorUrl)]
    public class JazorClickTagHelper : TagHelper
    {
        private const string Data = "data-";
        private const string JazorClick = "jazor-click";
        private const string JazorUrl = "jazor-url";
        private const string DataJazorClick = Data + JazorClick;
        private const string DataJazorUrl = Data + JazorUrl;
        private readonly IHttpContextAccessor _httpContext;
        private readonly IActionDescriptorCollectionProvider _routeProvider;

        //[HtmlAttributeName("jazor-click")]
        //public (string Action, object Key) ActionValue { get; set; }        

        [HtmlAttributeName(JazorClick)]
        public (string? Controller, string? Action, object? Key) Route { get; set; }

        [HtmlAttributeName(JazorUrl)] public string Url { get; set; } = "";

        public JazorClickTagHelper(IHttpContextAccessor httpContext, IActionDescriptorCollectionProvider routeProvider)
        {
            _httpContext = httpContext;
            _routeProvider = routeProvider;
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            // if this is used, no need to fiddle with Replace()
            //var route = _routeProvider.ActionDescriptors.Items.FirstOrDefault(w => w.RouteValues["action"] == Route.Action);

            //if (route == null) return;

            //route.RouteValues.

            if (!string.IsNullOrWhiteSpace(Url))
            {
                output.Attributes.TryGetAttribute(DataJazorUrl, out var jazorUrlAttribute);

                if (jazorUrlAttribute is null)
                    output.Attributes.Add("data-jazor-url", Url);

                return;
            }

            output.Attributes.TryGetAttribute(DataJazorClick, out var jazorClickAttribute);

            if (jazorClickAttribute is not null) return;

            output.Attributes.SetAttribute(DataJazorClick, GetUrl(Route));

            // Check AddClass for existing attributes
            //output.Attributes.Add(DataJazorClick, $"/{Route.Controller.ToLower()}/{Route.Action.ToLower()}/{Route.Key}");
        }

        private static string GetUrl((string? Controller, string? Action, object? Key) route)
        {
            (string? Controller, string? Action, object? Key) updatedRoute = (route.Controller?.Replace("controller", "", StringComparison.InvariantCultureIgnoreCase), route.Action, route.Key);

            return updatedRoute switch
            {
                (null, null, null) => "",
                (not null, null, null) r when r.Controller!.Contains("/") => r.Controller!.ToLower(),
                (not null, null, null) r => $"/{r.Controller!.ToLower()}",
                (not null, not null, null) r => $"/{r.Controller!.ToLower()}/{r.Action!.ToLower()}",
                (not null, not null, not null) r => $"/{r.Controller!.ToLower()}/{r.Action!.ToLower()}/{r.Key}",
                _ => ""
            };
        }
    }
}