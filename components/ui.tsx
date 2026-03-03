export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-zinc-100 " +
        "placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/70 " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white " +
        "hover:bg-violet-500 active:bg-violet-700 disabled:opacity-60 " +
        (props.className ?? "")
      }
    />
  );
}

export function LinkText({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-sm text-zinc-300 underline hover:text-white">
      {children}
    </a>
  );
}