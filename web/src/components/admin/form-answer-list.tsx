export type StoredFormAnswer = {
  questionKey: string;
  prompt: string;
  responseType: string;
  value: string | string[];
};

export function formatStoredAnswer(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export function FormAnswerList({ answers }: { answers: StoredFormAnswer[] }) {
  if (answers.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers recorded.</p>;
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {answers.map((answer) => (
        <div
          key={answer.questionKey}
          className="rounded-lg bg-[#f7f6f2] p-4"
        >
          <dt className="text-xs font-bold text-primary">{answer.prompt}</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
            {formatStoredAnswer(answer.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
