
if [%1]==[pub] (
  npx ts-node publish\publish.ts %*
)

if [%1]==[docs] (
  typedoc --out docs src/code --readme README.md
)

