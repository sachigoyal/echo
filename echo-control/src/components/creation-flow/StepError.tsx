import { Card, CardContent } from '../ui/card';

interface StepErrorProps {
  error?: string | null;
}

export default function StepError({ error }: StepErrorProps) {
  return (
    <div
      className={`mt-6 transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}
    >
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="text-sm text-destructive">{error || '\u00A0'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
