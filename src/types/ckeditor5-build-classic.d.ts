declare module "@ckeditor/ckeditor5-build-classic" {
  export default class ClassicEditor {
    static create(element: HTMLElement, config: { initialData: string; label: string }): Promise<ClassicEditor>;
    destroy(): Promise<void>;
  }
}
