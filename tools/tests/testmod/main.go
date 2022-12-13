package main

import (
	"fmt"
	"strings"
	"syscall/js"
	"unsafe"
)

func dialByFuncRef(cb, cb2 uint32)
func testBool(a, b, c bool)
func testU8(a, b, c byte)
func testU32(a, b, c uint32)
func testI32(a, b, c int32)
func testU64(a, b, c uint64)
func testI64(a, b, c int64)
func testF32(a, b, c float32)
func testF64(a, b, c float64)
func multiply(a, b int) int

type funcObj struct {
	v  js.Value
	id uint32
}

func getFuncID(cb js.Func) uint32 {
	ptr := unsafe.Pointer(&cb)
	x := (*funcObj)(ptr)
	return x.id
}

func testTestBool(a, b, c bool) {
	fmt.Printf("testBool(%[1]T(%[1]v), %[2]T(%[2]v), %[3]T(%[3]v))\n", a, b, c)
	testBool(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestU8(a, b, c byte) {
	fmt.Printf("testU8(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testU8(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestU32(a, b, c uint32) {
	fmt.Printf("testU32(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testU32(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestI32(a, b, c int32) {
	fmt.Printf("testI32(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testI32(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestU64(a, b, c uint64) {
	fmt.Printf("testU64(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testU64(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestF32(a, b, c float32) {
	fmt.Printf("testF32(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testF32(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestF64(a, b, c float64) {
	fmt.Printf("testF64(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testF64(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func testTestI64(a, b, c int64) {
	fmt.Printf("testU64(%[1]T(%[1]v; %[1]x), %[2]T(%[2]v; %[2]x), %[3]T(%[3]v; %[3]x))\n", a, b, c)
	testI64(a, b, c)
	fmt.Println(strings.Repeat("-", 80))
}

func main() {
	//testTestBool(true, false, true)
	//testTestU32(0x48, 0x4c, 0x4f)
	//testTestU64(0xFFFFFFFFFFFF, 0xFFFFFFFF00FF, 0xFFFFFFFFFFFFFFFF)
	testTestI32(128, -128, 256)
	//testTestI64(0xFFFFFFFFFFFF, -0xFFFFFFFF00FF, 0x7fffffffffffffff)
	testTestF32(3.14, 14.16, 3.33)
	testTestF64(3.14, 14.16, 3.33)
	//testTestU32(0x48, 65530, 0x4f)
	//testTestU8(0x48, 0x4c, 0x4f)
	//testTestU8(255, 128, 255)

	//testTestBool(true, true, true)
	//testTestBool(true, true, true)
	//testTestU32(128, 255, 128)
	//testTestBool(false, true, false)
	//testTestBool(true, false, true)

	//fmt.Printf("testBoolInt32(%v, %v)\n", true, uint32(255))
	//testBoolInt32(true, 255)
	//fn := js.FuncOf(func(_ js.Value, args []js.Value) any {
	//	fmt.Println("call in go")
	//	return nil
	//})
	//
	//Dial(fn)
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
	res := multiply(3, 4)
	fmt.Println("Multiply result:", res)
}
