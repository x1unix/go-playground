package main

import (
	"fmt"
	"syscall/js"
	"unsafe"
)

func dialByFuncRef(cb, cb2 uint32)

func sum(a, b int) int
func sum2(a, b int) (int, int)
func testSumArr2(items [2]int) [2]int
func readJSFunc(fn js.Func)

type funcObj struct {
	value struct {
		ref   uint64
		gcPtr uintptr
	}
	id uint32
}

func test_readJSFunc(fn js.Func) {
	ptr := (*funcObj)(unsafe.Pointer(&fn))
	fmt.Println("--- WANT: ---")
	fmt.Println("Func: {\n\tValue: {")
	fmt.Printf("\t\tref: %[1]d (%[1]x)\n", ptr.value.ref)
	fmt.Printf("\t\tgcPtr: %x\n", ptr.value.gcPtr)
	fmt.Println("\t}")
	fmt.Printf("\tid: %[1]d (%[1]x)\n", ptr.id)
	fmt.Println("}")
	fmt.Println("-------------")
	readJSFunc(fn)
}

func getFuncID(cb js.Func) uint32 {
	ptr := unsafe.Pointer(&cb)
	x := (*funcObj)(ptr)
	return x.id
}

func test_sum2(a, b int) (int, int) {
	fmt.Printf("sum2(%[1]T(%[1]v;%[1]x), %[2]T(%[2]v;%[2]x))\n", a, b)
	want1, want2 := b+1, a+b
	got1, got2 := sum2(a, b)
	fmt.Printf("Want: %[1]v,%[2]v (%[1]x,%[2]x)\n", want1, want2)
	fmt.Printf("Got:  %[1]v,%[2]v (%[1]x,%[2]x)\n", got1, got2)
	return got1, got2
}

func test_testSumArr2(items [2]int) [2]int {
	fmt.Printf("testSumArr2(%#v)\n", items)
	want := [2]int{
		items[1] + 1,
		items[0] + items[1],
	}

	got := testSumArr2(items)
	fmt.Printf("Want: %#v\n", want)
	fmt.Printf("Got: %#v\n", got)

	return got
}

func main() {
	//test_sum2(0x41, 0x42) // 5472; 1560
	test_testSumArr2([2]int{0x41, 0x42}) // 5472; 1560

	//testFunc := js.FuncOf(nil)
	//test_readJSFunc(testFunc)
}

//type handler struct {
//	api.WorkerServer
//}
//
//type serviceInfo struct {
//	impl    any
//	methods map[string]*grpc.MethodDesc
//}

//type jsServer struct {
//	impl     any
//	services map[string]*serviceInfo
//}
//
//func (srv *jsServer) RegisterService(desc *grpc.ServiceDesc, impl any) {
//	if impl != nil {
//		ht := reflect.TypeOf(desc.HandlerType).Elem()
//		st := reflect.TypeOf(impl)
//		if !st.Implements(ht) {
//			log.Fatalf("grpc: Server.RegisterService found the handler of type %v that does not satisfy %v", st, ht)
//		}
//	}
//
//	if len(desc.Streams) > 0 {
//		log.Fatal("gRPC streams are not supported")
//	}
//
//	srv.register(desc, impl)
//}
//
//func (srv *jsServer) register(desc *grpc.ServiceDesc, impl any) {
//	if srv.services == nil {
//		srv.services = make(map[string]*serviceInfo)
//	}
//
//	info := &serviceInfo{
//		impl:    impl,
//		methods: make(map[string]*grpc.MethodDesc),
//	}
//
//	for i := range desc.Methods {
//		d := &desc.Methods[i]
//		info.methods[d.MethodName] = d
//	}
//
//	srv.services[desc.ServiceName] = info
//}
//
//func (h handler) SayHello(_ context.Context, req *api.HelloRequest) (*flatbuffers.Builder, error) {
//	b := flatbuffers.NewBuilder(0)
//
//	api.HelloRequestStart(b)
//	api.HelloRequestAddName(b, b.CreateString("hello "+string(req.Name())))
//	b.Finish(api.HelloRequestEnd(b))
//	return b, nil
//}
//
//func main3() {
//	h := handler{}
//	srv := grpc.NewServer(grpc.ForceServerCodec(flatbuffers.FlatbuffersCodec{}))
//	api.RegisterWorkerServer(srv, h)
//
//	time.Sleep(5 * time.Second)
//}

func main2() {
	res := sum(3, 4)
	fmt.Println("Multiply result:", res)
}
