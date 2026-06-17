"use client";

export function BracketConnector({
  fromCount,
  toCount
}: {
  fromCount: number;
  toCount: number;
}) {
  const rows = Math.max(fromCount, toCount, 1);

  return (
    <div className="hidden min-w-[56px] flex-col justify-center lg:flex">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="bracket-connector-row">
          <span className="bracket-connector-line" />
          <span className="bracket-connector-node" />
          <span className="bracket-connector-line" />
        </div>
      ))}
    </div>
  );
}
