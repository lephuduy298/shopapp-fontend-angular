export class UpdateProductDTO {
    name: string;
    price: number;
    description: string;
    category_id: number;
    // thumbnail: string; // Assuming you might want to include a thumbnail
    active: boolean;
    // tags: string[];

    constructor(data: any) {
        this.name = data.name;
        this.price = data.price;
        this.description = data.description;
        this.category_id = data.category_id;
        this.active = data.active;
        // this.thumbnail = data.thumbnail || ''; // Default to empty string if not provided
        // this.tags = data.tags;
    }
}
