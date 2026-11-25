export type ProfileDTO = {
  name: string;
  image: string | null;
};

export type AvatarDTO = {
  data: Uint8Array<ArrayBuffer>;
  contentType: string;
};
