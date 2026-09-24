import './TranscriptBox.css';

export interface TranscriptBoxProps {
  text: string;
}

export function TranscriptBox({ text }: TranscriptBoxProps) {
  return (
    <pre className="transcript-box" data-testid="transcript-box">
      {text}
    </pre>
  );
}
