export interface MenuItemDto {
  menu: {
    id: number;
    stallId: number;
    name: string;
    price: number;
    isAvailable: boolean;
  };
  stall: {
    id: number;
    name: string;
    category: string | null;
    location: string | null;
  };
}