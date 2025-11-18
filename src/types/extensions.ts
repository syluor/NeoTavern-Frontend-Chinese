export interface ExtensionManifest {
  name: string;
  display_name: string;
  version?: string;
  author?: string;
  description?: string;
  loading_order?: number;
  requires?: string[]; // extras modules
  dependencies?: string[]; // other extensions
  minimum_client_version?: string;
  js?: string;
  css?: string;
  i18n?: Record<string, string>;
  auto_update?: boolean;
  generate_interceptor?: string;
}

export interface ExtensionPrompt {
  value: string;
  position: number;
  depth: number;
  scan: boolean;
  filter: () => boolean | Promise<boolean>;
}
