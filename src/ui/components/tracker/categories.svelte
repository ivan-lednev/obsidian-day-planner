<div class="categories">
  <div
    style:--category-color-rgb="var(--color-green-rgb)"
    style:width="20%"
    class="category"
  >
    #work
  </div>
  <div
    style:--category-color-rgb="var(--color-blue-rgb)"
    style:width="30%"
    class="category"
  >
    #home
  </div>
  <div
    style:--category-color-rgb="var(--color-yellow-rgb)"
    style:width="50%"
    class="category"
  >
    #gym
  </div>
</div>

<style>
  .categories {
    overflow: hidden;
    display: flex;

    height: var(--size-4-8);
    margin: var(--size-4-2) var(--size-4-3);

    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .category {
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--font-ui-smaller);
    font-weight: var(--font-medium);

    background-color: rgba(var(--category-color-rgb), 0.4);
  }

  .category:not(:last-child) {
    border-right: 1px solid var(--background-modifier-border);
  }
</style>
