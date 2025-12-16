/// <reference types="vite/client" />

declare module '*.svg' {
  import React from 'react';
  const content: React.FC<React.SVGProps<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly API_KEY: string;
  readonly SF_KEY: string;
  readonly SILICON_FLOW_KEY: string;
  readonly SILICONFLOW_API_KEY: string;
  // 更多环境变量...
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
