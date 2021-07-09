import React, { FormEvent, useEffect, useState } from "react";
import { BiPencil, BiTrash } from "react-icons/all";
import { Link } from "react-router-dom";
import { Card } from "../../../components/Card";
import { CategoryType } from "../../../components/Forms/Category/CreateOrEdit";
import { ProductType } from "../../../components/Forms/Product/CreateOrEdit";
import Outclick from "../../../components/Outclick";
import AdminLayout from "../../../layout/AdminLayout";
import { db } from "../../../services/firebase";
import "./index.css"
import { VscLoading as LoadingIcon, IoMdSad } from "react-icons/all";

const Index = () => {
  // The popup selected to show in the screen 
  const [popup, setPopup] = useState<"" | "delete-product">("");

  const [deleteSelectedProduct, setDeleteSelectedProduct] = useState<ProductType>();

  const [products, setProducts] = useState<ProductType[]>();

  const [filters, setFilters] = useState<{ category?: string, search?: string }>()

  const [loading, setLoading] = useState<boolean>(true);

  const HandleLoadProducts = async () => {
    setLoading(true);
    // Get the products in the database
    (filters?.category ?
      // If the category is selected, will execute the where condition
      db.collection("products").where("category", "==", filters?.category) :
      db.collection("products")
    ).get().then(querySnapshot => {
      let myProducts: ProductType[] = [];
      querySnapshot.forEach(doc => {
        // Search filter
        if (
          String(doc.data()?.name || "").toLowerCase().includes(filters?.search || "") ||
          String(doc.data()?.description || "").toLowerCase().includes(filters?.search || "")
        )
          myProducts.push({ id: doc.id, ...doc.data() })
      });
      setProducts(myProducts);
    }).catch((error) => {
      console.log("Error getting documents: ", error);
    }).finally(() => {
      setLoading(false);
    });
  };

  const [categories, setCategories] = useState<CategoryType[]>([]);

  const HandleLoadCategories = async () => {
    // Load the categories that will show in the category select input
    await db.collection("categories").get().then((querySnapshot) => {
      let myCategories: CategoryType[] = [];
      querySnapshot.forEach(doc => myCategories.push({ id: doc.id, name: doc.data().name }));
      setCategories(myCategories);
    });
  };


  const HandleDeleteProduct = async (e: FormEvent) => {
    e.preventDefault();

    let productDocRef = db.collection("products").doc(deleteSelectedProduct?.id);

    db.runTransaction((transaction) => {
      return transaction.get(productDocRef).then(productDoc => {
        // Verify if the product exist
        if (!productDoc.exists) throw new Error("Document does not exist!");
        // Deleting the product
        transaction.delete(productDocRef);
      });
    }).then(() => {
      HandleLoadProducts();
      setPopup("");
    }).catch(error => {
      console.log("Transaction failed: ", error);
    });
  };

  useEffect(() => {
    HandleLoadProducts();
    HandleLoadCategories();
  }, []);

  return (
    <>
      {popup !== "" && (
        <div className="fixed z-50 flex items-center justify-center top-0 left-0 h-screen w-screen bg-black bg-opacity-70">
          <Outclick
            callback={() => {
              setPopup("");
              setDeleteSelectedProduct(undefined);
            }}
          >
            <div>
              {
                {
                  "": <></>,
                  "delete-product": (
                    <form
                      data-aos="fade-down"
                      data-aos-duration="1000"
                      className="bg-white p-8 rounded"
                      onSubmit={HandleDeleteProduct}
                    >
                      <h2 className="text-2xl font-semibold text-gray-700">
                        Apagar {deleteSelectedProduct?.name}
                      </h2>
                      <hr />
                      <p className="text-md pt-4 text-gray-700">
                        Deseja apagar o produto "{deleteSelectedProduct?.name}"
                        permanentemente?
                      </p>
                      <hr className="my-4" />
                      <button
                        className="mx-2 text-white h-10 hover:bg-red-700 bg-red-500 py-2 px-6 rounded cursor-pointer"
                        type="submit"
                      >
                        Apagar {deleteSelectedProduct?.name}
                      </button>
                    </form>
                  ),
                }[popup]
              }
            </div>
          </Outclick>
        </div>
      )}

      <AdminLayout>
        <div className="container mt-12 mx-auto">
          <span className="text-2xl text-barbina-brown mx-4 pr-2 add-product-title-underline">
            Produtos
          </span>
          <div className="flex mx-2">
            <Link to="/admin/products/add">
              <button className="bg-green-600 ease-out duration-300 hover:bg-green-800 flex items-center gap-1 text-white py-1 mx-2 my-4 px-3 rounded cursor-pointer">
                Novo Produto
              </button>
            </Link>

            <button
              onClick={HandleLoadProducts}
              className="bg-yellow-500 ease-out duration-300 hover:bg-yellow-700 flex items-center gap-1 text-white py-1 mx-2 my-4 px-3 rounded cursor-pointer">
              Atualizar
            </button>
          </div>
          <hr />

          <div className="mt-2 py-4 px-2 mx-2 pb-8 bg-white border rounded shadow-sm">
            <form onSubmit={e => { e.preventDefault(); HandleLoadProducts() }} className="flex mb-4">
              <button type="submit" className="mx-2 bg-yellow-400 duration-300 hover:bg-yellow-700 text-white h-10 py-2 px-6 rounded cursor-pointer">
                Procurar
              </button>
              <div className="w-40 h-10 p-1 flex border border-gray-200 rounded">
                <select onChange={e => setFilters({ category: e.target.value, search: filters?.search })} className="mx-2 text-gray-600 form-select w-full">
                  <option value="">Todas</option>
                  {categories &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-full mx-2">
                <div className="p-1 flex border border-gray-200 rounded">
                  <input
                    placeholder="Procurar"
                    value={filters?.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    className="p-1 px-2 appearance-none outline-none w-full"
                  />
                </div>
              </div>
            </form>
            <hr />
            <div className="grid grid-cols-4 gap-2 p-2">
              {loading ? (
                <span className="col-span-4 w-full justify-center text-barbina-brown py-40 flex items-center text-xl gap-2">Carregando
                  <LoadingIcon className="rotate" />
                </span>
              ) : !products || products?.length <= 0 ?
                <span className="col-span-4 w-full justify-center text-barbina-brown py-40 flex items-center text-xl gap-2">Sem resultados encontrados
                  <IoMdSad />
                </span>
                :
                products.map(product => {
                  return (
                    <Card product={product}>
                      <hr className="border-barbina-brown" />
                      <div className="pt-2">
                        <div className="inline-block">
                          <Link to={`/admin/products/edit/${product.id}`}>
                            <button className="bg-yellow-500 ease-out duration-300 mb-2 hover:bg-yellow-700 flex items-center gap-1 text-white py-1 text-sm px-3 rounded cursor-pointer">
                              <BiPencil /> Editar
                            </button>
                          </Link>
                        </div>
                        <div className="inline-block mx-2">
                          <button
                            onClick={() => {
                              setDeleteSelectedProduct(product);
                              setPopup("delete-product");
                            }}
                            className="bg-red-500 ease-out duration-300 hover:bg-red-700 flex items-center gap-1 text-white py-1 text-sm px-3 rounded cursor-pointer"
                          >
                            <BiTrash /> apagar
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>

        </div>
      </AdminLayout>
    </>
  );
};

export default Index;
