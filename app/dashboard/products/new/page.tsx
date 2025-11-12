import { ProductForm } from '../components/ProductForm';
import { ToastProvider } from '@/components/ui/toast';

export default function NewProductPage() {
  return (
    <ToastProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111]">Add Product</h1>
          <p className="text-gray-600 mt-1">Create a new product for your store</p>
        </div>

        <ProductForm />
      </div>
    </ToastProvider>
  );
}
