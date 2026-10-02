export interface ViewerProps {
  text: string;
}

export function Viewer({ text }: ViewerProps) {
  return <telelux-transcript>{text}</telelux-transcript>;
}
