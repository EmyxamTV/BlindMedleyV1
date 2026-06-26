import { routes } from "@generated/registry";

type RouteName = keyof typeof routes;
type RouteParams<Name extends RouteName> = (typeof routes)[Name]["types"]["params"];
type RouteArgs<Name extends RouteName> = keyof RouteParams<Name> extends never
  ? { params?: RouteParams<Name> }
  : { params: RouteParams<Name> };

export function routeUrl<Name extends RouteName>(name: Name, args?: RouteArgs<Name>) {
  let url: string = routes[name].pattern;
  for (const [key, value] of Object.entries(args?.params ?? {})) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return url;
}
