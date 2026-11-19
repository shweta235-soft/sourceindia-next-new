declare module "@ckeditor/ckeditor5-build-classic" {
  export default class ClassicEditor {
    static create(element: HTMLElement, config: { initialData: string; label: string }): Promise<ClassicEditor>;
    ui: { view: { toolbar: { element: HTMLElement | null } } };
    getData(): string;
    setData(data: string): void;
    destroy(): Promise<void>;
  }
}
