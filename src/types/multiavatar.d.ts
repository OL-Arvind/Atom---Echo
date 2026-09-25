declare module "@multiavatar/multiavatar" {
  export default function multiavatar(
    avatarId: string,
    sansEnv?: boolean,
    ver?: { part?: string; theme?: string }
  ): string;
}

declare module "@multiavatar/multiavatar/esm" {
  export default function multiavatar(
    avatarId: string,
    sansEnv?: boolean,
    ver?: { part?: string; theme?: string }
  ): string;
}
